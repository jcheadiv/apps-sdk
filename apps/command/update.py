#
# Copyright (c) 2010 BitTorrent Inc.
#

import apps.command.base

class update(apps.command.base.Command):

    user_options = [
        ('ignorelocal', None, "Ignore packages that look like they're on local NATs.", None) ]

    help = 'Check the remote dependencies and update them.'
    post_commands = [ 'generate' ]

    def run(self):
        self.ignorelocal = self.options.get('ignorelocal', False)
        self.update_deps()
