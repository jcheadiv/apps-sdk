import glob
import os
import pkg_resources
import re

import apps.project

class gettxt(apps.command.base.Command):

    help = 'Extract html strings to messages.po'
    template = 'messages.po'
    regex = re.compile(r"(?<=>|})[^><}{]+?(?={|<|$)", re.M)
    strings = {}
    user_options = [
        ('keyword=', None, 'Look for strings in the arguments of this function; defaults to `gettext`', None)
    ]
    keyword = "gettext"

    def run(self): 
      if self.options.get('keyword', False):
        self.keyword = self.options['keyword']
      kwreg = re.compile(r"(?<="+self.keyword+"\().*(?=\))", re.M)
      template = open(pkg_resources.resource_filename(
                'apps.data', self.template), 'rb').read()
      index = open(os.path.join(self.project.path, 'messages.po'), 'wb')
      index.write(template+"\n\n")
      
      def messages(path, reg, remove):
        for infile in glob.glob(path):
          print infile
          input = open(infile, "rb").read()
          for m in re.finditer(reg, input):
            start = m.start()
            lineno = input.count('\n', 0, start) + 1
            word = m.group(0).strip().strip(remove)
            if len(word) and word in self.strings.keys():
              self.strings[word].append("#: %s:%s" % (infile, lineno))
            else: 
              self.strings[word] = ["#: %s:%s" % (infile, lineno)]
      
      messages(os.path.join(self.project.path, "html/", "*.html"), self.regex, "")   
      messages(os.path.join(self.project.path, "lib/", "*.js"), kwreg, '\'"')    
      
      for s in self.strings.keys():
        for o in self.strings[s]:
          index.write(o+"\n")
        index.write("msgid \"%s\"\n" % (s))
        index.write("msgtr \"\"\n\n")
      
      index.close()