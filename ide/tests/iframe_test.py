# -*- coding: utf-8 -*-
from data.exploits.base.BasicExploit import BasicExploit
from settings import mapped_port_host

class Exploit(BasicExploit):

    attributes = {
        "Name" : " ",
        "Description" : " ",
        "Target" : " ",
        "Container" : " ",
        "Type" : " "
    }

    def runExploit(self):
        self.base_url = "http://localhost:49160/"
        if self.base_url.endswith("/"):
            self.base_url = self.base_url[:-1]
        wrapper = self.wrapper
        wrapper.navigate(self.base_url + "/page.html")
        self.assertEqual("onloadalert", wrapper.get_alert_text())
        wrapper.switchToframe("ramiFrame1")
        wrapper.find("qsearch__in").click()
        wrapper.find("qsearch__in").clear()
        wrapper.find("qsearch__in").keys("some not important words")
        wrapper.find("research topics").click()
        wrapper.selectWindow("ramiFrame2")
        wrapper.find("photo").click()
        wrapper.selectWindow("null")
        wrapper.find("comment").clear()
        wrapper.find("comment").keys("Wow!!")
    
