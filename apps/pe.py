import struct

class pesect:
    def __init__(self,file):
        if type(file) == type({}):
            self.name = file['name']
            self.vsize = file['vsize']
            self.vaddr = file['vaddr']
            self.psize = file['psize']
            self.paddr = file['paddr']
            self.reloc = 0
            self.lnum = 0
            self.nreloc = 0
            self.nlnum = 0
            self.characteristics = file['characteristics']
            self.data = file['data']
        else:
            shdata = file.read(40)
            self.name, self.vsize, self.vaddr, self.psize, self.paddr, self.reloc, self.lnum, self.nreloc, self.nlnum, self.characteristics = \
                struct.unpack('<8sIIIIIIHHI', shdata)
            while self.name[-1] == '\0':
                self.name = self.name[:-1]
            file.seek(self.paddr)
            self.data = file.read(self.psize)

#        while len(self.data) < self.vsize:
#            self.data += '\0'

    def writehdr(self,file):
        file.write(struct.pack\
                       ('<8sIIIIIIHHI', \
                        self.name, 
                        self.vsize, 
                        self.vaddr, 
                        self.psize, 
                        self.paddr, 
                        self.reloc, 
                        self.lnum, 
                        self.nreloc, 
                        self.nlnum, 
                        self.characteristics))

class pereloc:
    def __init__(self,base,fixupent):
        self.type = (fixupent >> 12) & 0xf
        self.target = base + (fixupent & 0xfff)

class peimport:
    def __init__(self,pe,ilt,namerva,iat):
        self.name = pe.stringrva(namerva)
        self.symbols = {}
        symnum = 0
        while 1:
            iltaddr = ilt + symnum * 4
            iltent = struct.unpack('<I',pe.rvaread(iltaddr,4))[0]
            if not iltent:
                break
            iataddr = iat + symnum * 4
            symnum += 1
            if iltent & 0x80000000:
#               raise Exception("Import by ordinal not supported yet")
                pass
            self.symbols[iataddr] = pe.stringrva(iltent+2)

class pecoff:
    def targetsec(self,rva):
        for s in self.sections:
            if s.vaddr <= rva and s.vaddr + s.vsize > rva:
                return s
        return None

    def rvaread(self,rva,length):
        if length == 0:
            return ''
        for s in self.sections:
            if s.vaddr <= rva and rva < s.vaddr + s.vsize:
                runlen = min(s.vaddr + s.vsize, rva + length) - rva
                s = s.data[rva - s.vaddr:rva - s.vaddr + runlen] + self.rvaread(rva + runlen, length - runlen)
                return s
        raise 'broken pe coff: rvaread to unmapped area'

    def stringrva(self,namerva):
        ch = self.rvaread(namerva,1)
        if ord(ch):
            return ch + self.stringrva(namerva+1)
        else:
            return ''

    def __init__(self,file):
        self.file = file
        file.seek(0)
        mzsig = file.read(2)
        if mzsig != 'MZ':
            raise 'wrong mz signature'
        file.seek(0x3c)
        self.pehdr = struct.unpack('<I', file.read(4))[0]
        file.seek(self.pehdr)
        pesig = file.read(2)
        if pesig != 'PE':
            raise 'wrong pe signature'
        file.seek(self.pehdr)
        self.peheader = file.read(24)
        (machine, numsect, builddate, symtab, numsyms, opthdr, characteristics) = \
            struct.unpack('<HHIIIHH', self.peheader[4:])
        self.ntheader = file.read(opthdr)
        self.entrypoint = struct.unpack('<I', self.ntheader[16:20])[0]
        self.imagebase = struct.unpack('<I', self.ntheader[28:32])[0]
        self.filealign = struct.unpack('<i', self.ntheader[36:40])[0]
        numdirectories = struct.unpack('<I', self.ntheader[92:96])[0]
        self.directories = []
        for i in xrange(0,numdirectories):
            self.directories.append(struct.unpack('<II', self.ntheader[96 + 8 * i:104 + 8 * i]))
        self.sections = []
        for i in xrange(0,numsect):
            shloc = self.pehdr + 24 + opthdr + 40 * i
            file.seek(shloc)
            sect = pesect(file)
            self.sections.append(sect)
        fixuprange = self.rvaread(self.directories[5][0],self.directories[5][1])
        f = 0
        self.fixups = {}
        while f < len(fixuprange):
            fixpage, fixsize = struct.unpack('<II', fixuprange[f:f+8])
            last = f + fixsize
            f += 8
            while f < last:
                r = pereloc(fixpage, struct.unpack('<H', fixuprange[f:f+2])[0])
                self.fixups[r.target] = r
                f += 2

    def file_round_up(self,n):
        return (n + self.filealign - 1) & ~(self.filealign - 1)

    def write(self,file):
        self.peheader = self.peheader[:6] + struct.pack('<H',len(self.sections)) + self.peheader[8:]
        self.ntheader = self.ntheader[:56] + struct.pack('<I',self.sections[-1].vaddr + self.sections[-1].vsize) + self.ntheader[60:]

        self.file.seek(0)
        file.write(self.file.read(0x40))
        for i in xrange(0x40,self.pehdr):
            file.write('\0')
        file.write(self.peheader)
        file.write(self.ntheader)
        filepos = len(self.sections) * 40 + file.tell()
        for s in self.sections:
            s.paddr = self.file_round_up(filepos)
            s.writehdr(file)
            filepos += s.psize
        for s in self.sections:
            pl = file.tell()
            while pl < s.paddr:
                file.write('\0')
                pl += 1
            file.write(s.data[:s.psize])

import sys

if __name__ == '__main__':
    p = pecoff(open(sys.argv[1],'rb'))
    
