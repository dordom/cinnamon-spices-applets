#!/usr/bin/python3
# -*- coding: utf-8 -*-

import gi
gi.require_version("Gtk", "3.0")
from gi.repository import Gtk
import gettext
from os.path import expanduser
import datetime

lang = gettext.translation("power-switch@dordom", localedir = expanduser("~") + "/.local/share/locale", fallback=True)
lang.install()
_ = lang.gettext

class MyWindow(Gtk.Window):
    def __init__(self):
        Gtk.Window.__init__(self, title=_("Delayed Shutdown"))

        self.vbox = Gtk.Box(orientation=Gtk.Orientation.VERTICAL, spacing=5)
        self.vbox.set_border_width(10)

        self.hbox1 = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=5)

        self.after_button = Gtk.ToggleButton(label=_("Shutdown after"))
        self.after_button.connect("toggled", self.on_button_toggled, True)

        self.at_button = Gtk.ToggleButton(label=_("Shutdown at"))
        self.at_button.connect("toggled", self.on_button_toggled, False)

        self.hbox2 = Gtk.Box(orientation=Gtk.Orientation.HORIZONTAL, spacing=5)

        self.hours_combo = Gtk.ComboBoxText()
        self.minute_combo = Gtk.ComboBoxText()
        self.seconds_combo = Gtk.ComboBoxText()
        for n in range(24):
            self.hours_combo.append_text(_("%s hours") % n)
        for n in range(60):
            self.minute_combo.append_text(_("%s minute") % n)
            self.seconds_combo.append_text(_("%s seconds") % n)

        self.start_button = Gtk.Button.new_with_label(_("Start"))
        self.start_button.connect("clicked", self.on_button_clicked)

        self.visible(False)

        self.add(self.vbox)

        self.vbox.pack_start(self.hbox1, True, True, 0)
        self.hbox1.pack_start(self.after_button, True, True, 0)
        self.hbox1.pack_start(self.at_button, True, True, 0)
        self.vbox.pack_start(self.hbox2, True, True, 0)
        self.hbox2.pack_start(self.hours_combo, True, True, 0)
        self.hbox2.pack_start(self.minute_combo, True, True, 0)
        self.hbox2.pack_start(self.seconds_combo, True, True, 0)
        self.vbox.pack_start(self.start_button, True, True, 0)

    def visible(self, visible):
        if visible:
            self.hours_combo.set_active(0)
            self.minute_combo.set_active(0)
            self.seconds_combo.set_active(0)
        else:
            self.hours_combo.set_active(-1)
            self.minute_combo.set_active(-1)
            self.seconds_combo.set_active(-1)
        self.hours_combo.set_sensitive(visible)
        self.minute_combo.set_sensitive(visible)
        self.seconds_combo.set_sensitive(visible)
        self.start_button.set_sensitive(visible)

    def on_button_toggled(self, button, after):
        if button.get_active():
            if after:
                self.hbox1.remove(self.at_button)
            else:
                self.hbox1.remove(self.after_button)
            self.visible(True)
        else:
            self.hbox1.remove(self.after_button)
            self.hbox1.remove(self.at_button)
            self.hbox1.pack_start(self.after_button, True, True, 0)
            self.hbox1.pack_start(self.at_button, True, True, 0)
            self.visible(False)
            
    def on_button_clicked(self, button):
        if self.after_button.get_active():
            timer = (self.hours_combo.get_active() * 60 + self.minute_combo.get_active()) * 60 + self.seconds_combo.get_active()
        else:
            timer = ((self.hours_combo.get_active() - datetime.datetime.now().hour) * 60 + (self.minute_combo.get_active() - datetime.datetime.now().minute)) * 60 + (self.seconds_combo.get_active() - datetime.datetime.now().second)
        print(timer)
        Gtk.main_quit()


win = MyWindow()
win.connect("destroy", Gtk.main_quit)
win.show_all()
Gtk.main()
