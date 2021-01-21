const UUID = "power-switch@dordom";
const Gettext = imports.gettext;
const GLib = imports.gi.GLib;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Applet = imports.ui.applet;
const Settings = imports.ui.settings;
const Lang = imports.lang;
const Util = imports.misc.util;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;

Gettext.bindtextdomain(UUID, GLib.get_home_dir() + "/.local/share/locale");

function _(str) {
   let customTranslation = Gettext.dgettext(UUID, str);
   if(customTranslation != str) {
      return customTranslation;
   }
   return Gettext.gettext(str);
}

class CommandItem extends PopupMenu.PopupBaseMenuItem {
    constructor(icon_name, icon_type, title) {
        super();

        try {

            if (icon_type) {
                let icon = new St.Icon({ icon_name: icon_name, icon_type: St.IconType.FULLCOLOR, icon_size: 26});
                this.addActor(icon);
            } else {
                let icon = new St.Icon({ icon_name: icon_name, icon_type: St.IconType.SYMBOLIC, icon_size: 26});
                this.addActor(icon);
            }

            let label = new St.Label({ text: title });
            this.addActor(label);
        } catch(e){
            global.logError(e);
        }
    }
}

class CinnamonApplet extends Applet.TextIconApplet {
    constructor(metadata, orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);

        try {
            this.metadata = metadata;

            this.settings = new Settings.AppletSettings(this, UUID, instance_id);
            this.settings.bind("icon-type", "iconType", this.on_menu_refresh);
            this.settings.bind("show-system-settings", "show_System_Settings", this.on_menu_refresh);
            this.settings.bind("show-restart-to-uefi", "show_Restart_to_UEFI", this.on_menu_refresh);
            this.settings.bind("show-delayed-shutdown", "show_Delayed_Shutdown", this.on_menu_refresh);
            this.settings.bind("show-switch-user", "show_Switch_User", this.on_menu_refresh);
            this.settings.bind("show-logout", "show_Logout", this.on_menu_refresh);
            this.settings.bind("show-lock-screen", "show_Lock_Screen", this.on_menu_refresh);
            this.settings.bind("show-suspend", "show_Suspend", this.on_menu_refresh);
            this.settings.bind("show-reboot", "show_Reboot", this.on_menu_refresh);
            this.settings.bind("show-shutdown", "show_Shutdown", this.on_menu_refresh);

            this.set_applet_icon_symbolic_name("system-shutdown");
            this.set_applet_label("");
            this.set_applet_tooltip(_("Power switch"));

            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menu = new Applet.AppletPopupMenu(this, orientation);
            this.menuManager.addMenu(this.menu);

            this.timer = -1;
            this.on_menu_refresh();
        }
        catch (e) {
            global.logError(e);
        }
    }

    on_applet_clicked(event) {
        this.menu.toggle();
    }

    on_menu_refresh() {
        this.menu.removeAll();
        var count = 0;

        if (this.show_System_Settings) {
            this.item = new CommandItem("preferences-system", this.iconType, _("System Settings"));
            this.item.connect("activate", Lang.bind(this, function() {
                Util.spawnCommandLine("cinnamon-settings");
            }));
            this.menu.addMenuItem(this.item);
        } else {
            count += 1;
        }

        if (this.show_Restart_to_UEFI) {
            this.item = new CommandItem("applications-system", this.iconType, _("Restart to UEFI"));
            this.item.connect("activate", Lang.bind(this, function() {
                Util.spawnCommandLine("systemctl reboot --firmware-setup");
            }));
            this.menu.addMenuItem(this.item);
        } else {
            count += 1;
        }

        if (this.timer > 0) {
            this.item = new CommandItem("gtk-stop", this.iconType, _("Abort Delayed Shutdown"));
            this.item.connect("activate", Lang.bind(this, function() {
                this.timer = -1;
                this.on_menu_refresh();
            }));
            this.menu.addMenuItem(this.item);
        } else if (this.show_Delayed_Shutdown) {
            this.item = new CommandItem("gnome-break-timer", this.iconType, _("Delayed Shutdown"));
            this.item.connect("activate", Lang.bind(this, function() {
                Util.spawn_async(["python3", this.metadata.path + "/timer.py"], Lang.bind(this, function(response) {
                    if (response > 0) {
                        this.timer = response;
                        this.countdown();
                        this.on_menu_refresh();
                    }
			    }));
            }));
            this.menu.addMenuItem(this.item);
        } else {
            count += 1;
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        if (this.show_Switch_User) {
            this.item = new CommandItem("system-users", this.iconType, _("Switch User"));
            this.item.connect("activate", Lang.bind(this, function() {
                Util.spawnCommandLine("dm-tool switch-to-greeter");
            }));
            this.menu.addMenuItem(this.item);
        } else {
            count += 1;
        }

        if (this.show_Logout) {
            this.item = new CommandItem("system-log-out", this.iconType, _("Logout"));
            this.item.connect("activate", Lang.bind(this, function() {
                Util.spawnCommandLine("gnome-session-quit --force");
            }));
            this.menu.addMenuItem(this.item);
        } else {
            count += 1;
        }

        if (this.show_Lock_Screen) {
            this.item = new CommandItem("system-lock-screen", this.iconType, _("Lock screen"));
            this.item.connect("activate", Lang.bind(this, function() {
                Util.spawnCommandLine("cinnamon-screensaver-command --lock");
            }));
            this.menu.addMenuItem(this.item);
        } else {
            count += 1;
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        if (this.show_Suspend) {
            this.item = new CommandItem("system-suspend", this.iconType, _("Suspend"));
            this.item.connect("activate", Lang.bind(this, function() {
                Util.spawnCommandLine("systemctl suspend");
            }));
            this.menu.addMenuItem(this.item);
        } else {
            count += 1;
        }

        if (this.show_Reboot) {
            this.item = new CommandItem("system-reboot", this.iconType, _("Reboot"));
            this.item.connect("activate", Lang.bind(this, function() {
                Util.spawnCommandLine("systemctl reboot");
           }));
           this.menu.addMenuItem(this.item);
        } else {
            count += 1;
        }

        if (this.show_Shutdown) {
            this.item = new CommandItem("system-shutdown", this.iconType, _("Shutdown"));
            this.item.connect("activate", Lang.bind(this, function() {
                Util.spawnCommandLine("systemctl poweroff");
            }));
            this.menu.addMenuItem(this.item);
        } else {
            count += 1;
        }

        if (count == 9) {
            this.item = new CommandItem("dialog-warning", this.iconType, _("Add a button to the menu in the setup!"));
            this.item.connect("activate", Lang.bind(this, function() {
                Util.spawnCommandLine("cinnamon-settings applets " + UUID);
            }));
            this.menu.addMenuItem(this.item);
        }
    }

    countdown() {
        if (this.timer > 0) {
            let hours = Math.floor(this.timer / 3600);
            let remain = this.timer % 3600
            let minute = Math.floor(remain / 60);
            let seconds = remain % 60;
            let timer_string = " " + _("Shutdown after") + " ";
            if (hours < 10) {timer_string += "0"}
            timer_string += hours.toString();
            timer_string += ":";
            if (minute < 10) {timer_string += "0"}
            timer_string += minute.toString();
            timer_string += ":";
            if (seconds < 10) {timer_string += "0"}
            timer_string += seconds.toString();
            this.set_applet_label(timer_string);
            this.timer--;
            Mainloop.timeout_add_seconds(1, Lang.bind(this, this.countdown));
        } else if (this.timer == 0) {
            Util.spawnCommandLine("systemctl poweroff");
        } else {
            this.set_applet_label("");
        }
    }
}

function main(metadata, orientation, panel_height, instance_id) {
    return new CinnamonApplet(metadata, orientation, panel_height, instance_id);
}
