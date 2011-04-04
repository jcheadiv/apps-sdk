import glob
import mako.template
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

    def messages(self, path, reg, remove):
      for infile in glob.glob(path):
        input = open(infile, "rb").read()
        for m in re.finditer(reg, input):
          start = m.start()
          lineno = input.count('\n', 0, start) + 1
          word = m.group(0).strip(remove)
          if len(word) and len(re.sub(r'\s', '', word.strip())):
            if word in self.strings.keys():
              self.strings[word].append("#: %s:%s" % (infile, lineno))
            else: 
              self.strings[word] = ["#: %s:%s" % (infile, lineno)]

    def run(self): 
      if self.options.get('keyword', False):
        self.keyword = self.options['keyword']
      kwreg = re.compile(r"(?<="+self.keyword+"\().*(?=\))", re.M)
           
      self.messages(os.path.join(self.project.path, "html/", "*.html"), self.regex, "")   
      self.messages(os.path.join(self.project.path, "lib/", "*.js"), kwreg, '\'"')    
      
      template = mako.template.Template(
                filename=pkg_resources.resource_filename(
                'apps.data', self.template), cache_enabled=False)
      index = open(os.path.join(self.project.path, 'messages.po'), 'wb')
      index.write(template.render(strings=self.strings))
      
      index.close()