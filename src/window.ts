import Adw from "gi://Adw";
import Shumate from "gi://Shumate";
import GObject from "gi://GObject?version=2.0";

import { NetworksListPage } from "./networks-list-page.js";
import type NetworkInformation from "./network-information.js";
import { NetworkPage } from "./network-page.js";

// @ts-expect-error gi-types
GObject.type_ensure(Shumate.SimpleMap);
// @ts-expect-error gi-types
GObject.type_ensure(NetworksListPage);
// @ts-expect-error gi-types
GObject.type_ensure(NetworkPage);
// @ts-expect-error gi-types
GObject.type_ensure(Shumate.MarkerLayer);

export class SixWheelsWindow extends Adw.Window {
    _networks_list_page!: NetworksListPage;
    _navigation_view!: Adw.NavigationView;

    static {
        GObject.registerClass(
            {
                GTypeName: "SixWheelsWindow",
                Properties: {
                    "selected-network": GObject.ParamSpec.object(
                        "selected-network",
                        "Selected Network",
                        "The user selected network to view.",
                        // @ts-expect-error gi-types
                        GObject.ParamFlags.READWRITE,
                        GObject.Object
                    ),
                    "network-selected": GObject.ParamSpec.boolean(
                        "network-selected",
                        "Network Selected",
                        "Whether the user has selected a network.",
                        GObject.ParamFlags.READWRITE,
                        false
                    ),
                },
                Template: "resource:///dev/garyli/SixWheels/window.ui",
                InternalChildren: ["networks_list_page", "navigation_view"],
            },
            this
        );
    }

    constructor(params?: Partial<Adw.ApplicationWindow.ConstructorProps>) {
        super(params);
    }

    push_new_network(
        _networks_list_page: NetworksListPage,
        chosen_network: typeof NetworkInformation
    ) {
        const network_page = new NetworkPage({
            "selected-network": chosen_network,
            title: chosen_network.name,
        });
        this._navigation_view.push(network_page);
    }
}
