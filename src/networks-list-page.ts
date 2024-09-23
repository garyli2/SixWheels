import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw";
import GObject from "gi://GObject";
import Gio from "gi://Gio";

import NetworkInformation from "./network-information.js";

Gio._promisify(
    Gio.File.prototype,
    "load_contents_async",
    "load_contents_finish"
);

interface CatalogItem {
    "Country Code": string;
    Name: string;
    Location: string;
    URL: string;
    "Auto-Discovery URL": string;
}

export class NetworksListPage extends Adw.NavigationPage {
    private _networks_list_view!: Gtk.ListView;
    private _next_button!: Gtk.Button;
    private _scrolled_window!: Gtk.ScrolledWindow;
    private _search_entry!: Gtk.SearchEntry;
    private custom_filter: Gtk.CustomFilter = new Gtk.CustomFilter();

    private selected_network!: NetworkInformation;
    private network_selected!: boolean;
    private search_term!: string;

    static {
        GObject.registerClass(
            {
                GTypeName: "NetworksListPage",
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
                    "search-term": GObject.ParamSpec.string(
                        "search-term",
                        "Search term",
                        "The current search term of the network list.",
                        GObject.ParamFlags.READWRITE,
                        ""
                    ),
                },
                Signals: {
                    "chosen-network": {
                        // @ts-expect-error gi-types
                        param_types: [NetworkInformation],
                    },
                },
                Template:
                    "resource:///dev/garyli/SixWheels/networks-list-page.ui",
                InternalChildren: [
                    "networks_list_view",
                    "next_button",
                    "scrolled_window",
                    "search_entry",
                ],
            },
            this
        );
    }

    emit_chosen_network() {
        console.log(
            "Selected network ",
            this.selected_network.name,
            this.selected_network.url
        );
        this.emit("chosen-network", this.selected_network);
    }

    update_search_text() {
        this.search_term = this._search_entry.text;
        this.custom_filter.changed(Gtk.FilterChange.DIFFERENT);
    }

    constructor(constructProperties = {}) {
        super(constructProperties);

        // setup string filter and model
        this.custom_filter.set_filter_func((network_info) => {
            if (!this.search_term) return true; // vacuously true
            if (!(network_info instanceof NetworkInformation)) return false;
            const data_string = [
                network_info.name,
                network_info.location,
                network_info.country,
            ]
                .join(", ")
                .toLowerCase();
            return data_string.includes(this.search_term.toLowerCase());
        });

        this.populateList();
    }

    populateList() {
        this.read_networks_catalog()
            .then((catalog) => {
                this.build_network_list(catalog);
            })
            .catch((e) => console.log(e));
    }

    async read_networks_catalog() {
        const file = Gio.File.new_for_uri(
            "resource://dev/garyli/SixWheels/catalog.json"
        );
        // @ts-expect-error gi-types promisify
        // eslint-disable-next-line @typescript-eslint/await-thenable, @typescript-eslint/no-unused-vars
        const [contents] = await file.load_contents_async(null);

        const decoder = new TextDecoder("utf-8");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const contentsString = decoder.decode(contents);
        const catalog = JSON.parse(contentsString) as CatalogItem[];

        return catalog;
    }

    build_network_list(catalog: CatalogItem[]) {
        // @ts-expect-error __type__
        const model = new Gio.ListStore({ item_type: NetworkInformation });
        // convert pure js objects to GObject for our list view model
        catalog.forEach((network) => {
            const location = network.Location;
            const network_info = new NetworkInformation();
            network_info.name = network.Name;
            network_info.country = network["Country Code"];
            network_info.location = location;
            network_info.url = network["Auto-Discovery URL"];
            model.append(network_info);
        });
        const filter_model = new Gtk.FilterListModel({
            filter: this.custom_filter,
            model,
        });
        const single_selection_model = new Gtk.SingleSelection();
        single_selection_model.set_autoselect(false);
        single_selection_model.set_model(filter_model);

        single_selection_model.bind_property(
            "selected-item",
            this,
            "selected-network",
            GObject.BindingFlags.DEFAULT
        );
        single_selection_model.connect(
            "notify::selected-item",
            (model: Gtk.SingleSelection) => {
                this.network_selected = model.selected_item !== null;
            }
        );

        this._networks_list_view.set_model(single_selection_model);
    }

    on_search_entry_click_grab_focus() {
        this._search_entry.grab_focus();
    }
}
