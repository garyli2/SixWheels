import Adw from "gi://Adw";
import Gio from "gi://Gio";
import GObject from "gi://GObject";
import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk?version=4.0";

import { SixWheelsWindow } from "./window.js";

/**
 * This class is the foundation of most complex applications.
 * It handles many things crucial for app developers:
 *  - Registers a D-Bus name for your application
 *  - Makes sure the application process is unique
 *  - Registers application resources like icons, ui files, menus, and shortcut dialogs.
 *  - Allows app developers to easily set up global actions and shortcuts
 *
 * Here we're using AdwApplication, which provides extra functionality by automatically
 * loading custom styles and initializing the libadwaita library.
 *
 * For more information on AdwApplication and its parent classes, see:
 *  - https://gnome.pages.gitlab.gnome.org/libadwaita/doc/main/class.Application.html
 *  - https://docs.gtk.org/gtk4/class.Application.html
 *  - https://docs.gtk.org/gio/class.Application.html
 */
export class Application extends Adw.Application {
    private window?: SixWheelsWindow;

    /**
     * When subclassing a GObject, we need to register the class with the
     * GObject type system. We do this here in the static initializer block,
     * as it needs to be run before everything else.
     *
     * For more information on subclassing and the abilities of
     * `GObject.registerClass()`, see https://gjs.guide/guides/gobject/subclassing.html
     */
    static {
        GObject.registerClass(this);
    }

    constructor() {
        super({
            application_id: "dev.garyli.SixWheels",
            flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
        });

        const quit_action = new Gio.SimpleAction({ name: "quit" });
        quit_action.connect("activate", () => {
            this.quit();
        });

        this.add_action(quit_action);
        this.set_accels_for_action("app.quit", ["<Control>q"]);

        const show_about_action = new Gio.SimpleAction({ name: "about" });
        show_about_action.connect("activate", () => {
            const aboutDialog = new Adw.AboutDialog({
                application_name: _("SixWheels"),
                application_icon: "dev.garyli.SixWheels",
                developer_name: "Gary Li",
                version: "0.1",
                developers: ["Gary Li <gary.li1@uwaterloo.ca>"],
                copyright: "© 2024 Gary Li",
            });

            aboutDialog.present(this.active_window);
        });

        this.add_action(show_about_action);

        Gio._promisify(Gtk.UriLauncher.prototype, "launch", "launch_finish");
    }

    // When overriding virtual functions, the function name must be `vfunc_$funcname`.
    public vfunc_activate(): void {
        if (!this.window) {
            this.window = new SixWheelsWindow({ application: this });
        }

        // load css
        const display = Gdk.Display.get_default();
        const css_provider = new Gtk.CssProvider();
        css_provider.load_from_resource("/dev/garyli/SixWheels/style.css");

        if (display) {
            Gtk.StyleContext.add_provider_for_display(
                display,
                css_provider,
                Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
            );
            const theme = Gtk.IconTheme.get_for_display(display);
            theme.add_resource_path("/dev/garyli/SixWheels/icons");
        }

        this.window.present();
    }
}

export function main(argv: string[]): Promise<number> {
    const app = new Application();
    return app.runAsync(argv);
}
