import Gtk from "gi://Gtk?version=4.0";
import Adw from "gi://Adw";
import Shumate from "gi://Shumate";
import GObject from "gi://GObject";

import { fetch, flattenObj, humanize_name } from "./utils.js";
import { StationInfoMarker } from "./station-info-marker.js";
import type NetworkInformation from "./network-information.js";

import {
    StationInformation as StationInformationResponse,
    StationStatus as StationStatusResponse,
    SystemInformation,
} from "gbfs-typescript-types/v3.0";
import { Gbfs } from "gbfs-typescript-types/v3.0/gbfs.js";
import { Station } from "gbfs-typescript-types/v3.0/station_information.js";
import { Station as StationStatus } from "gbfs-typescript-types/v3.0/station_status.js";

export class NetworkPage extends Adw.NavigationPage {
    // class fields
    #station_status_url?: string;
    #station_information_url?: string;
    #system_information_url?: string;

    static {
        GObject.registerClass(
            {
                GTypeName: "NetworkPage",
                Properties: {
                    "selected-network": GObject.ParamSpec.object(
                        "selected-network",
                        "Selected Network",
                        "The user selected network to view.",
                        // @ts-expect-error gi-types
                        GObject.ParamFlags.READWRITE,
                        GObject.Object
                    ),
                    "network-data": GObject.ParamSpec.jsobject(
                        "network-data",
                        "Network Data",
                        "Map of station information about a shared mobility network.",
                        GObject.ParamFlags.READWRITE
                    ),
                    "marker-layer": GObject.ParamSpec.object(
                        "marker-layer",
                        "Shumate Marker Layer",
                        "The marker layer for the current map_widget child.",
                        // @ts-expect-error gi-types
                        GObject.ParamFlags.READWRITE,
                        Shumate.MarkerLayer
                    ),
                    "station-map": GObject.ParamSpec.jsobject(
                        "station-map",
                        "Station Map",
                        "Map of station ids to station infos",
                        GObject.ParamFlags.READWRITE
                    ),
                },
                Template: "resource:///dev/garyli/SixWheels/network-page.ui",
                InternalChildren: ["map_widget", "stats_group"],
            },
            this
        );
    }

    private station_markers = new Map<string, StationInfoMarker>(); // map of already constructed marker widgets
    private marker_layer?: Shumate.MarkerLayer;

    private _map_widget!: Shumate.SimpleMap;
    private _stats_group!: Gtk.ListBox;

    private selected_network!: NetworkInformation;
    private station_info_map = new Map<string, Station>(); // concrete immutable information (e.g lat/lon, name)
    private station_status_map = new Map<string, StationStatus>(); // temporal information (e.g # of available vehicles)

    constructor(constructProperties = {}) {
        super(constructProperties);

        const map_widget = this._map_widget;
        const registry = Shumate.MapSourceRegistry.new_with_defaults();
        // Use OpenStreetMap as the source
        const map_source = registry.get_by_id(Shumate.MAP_SOURCE_OSM_MAPNIK);
        if (!map_source) return;

        map_widget.map_source = map_source;
        const viewport = map_widget.viewport;
        // Reference map source used by MarkerLayer
        viewport.reference_map_source = map_source;
        viewport.zoom_level = 13;

        // marker layer
        this.marker_layer = new Shumate.MarkerLayer({ viewport });
        map_widget.get_map().add_layer(this.marker_layer);

        const gesture = new Gtk.GestureClick();
        map_widget.add_controller(gesture);

        this.connect("notify::network-data", (self: NetworkPage) =>
            NetworkPage.buildOrUpdateStations(self)
        );
        this.fetchNetworkUrls()
            .then(() =>
                Promise.all([
                    this.fetchStationInformation(),
                    this.fetchStationStatus(),
                    this.fetchSystemInformation(),
                ])
            )
            .then(() => NetworkPage.buildOrUpdateStations(this))
            .then(() => this.zoomToStations())
            .catch((e) => console.log(e));
    }

    refreshStationStatus() {
        this.fetchStationStatus()
            .then(() => NetworkPage.buildOrUpdateStations(this))
            .catch((e) => console.log(e));
    }

    static buildOrUpdateStations(self: NetworkPage) {
        const marker_layer = self.marker_layer;

        self.station_info_map.forEach((stationInfo, stationId) => {
            let stationMarker = self.station_markers.get(stationId);
            const stationStatus = self.station_status_map.get(stationId);
            if (!stationInfo || !stationStatus) return;

            // if the station is already on the map, update its properties
            if (stationMarker) {
                console.log("Updating ", stationInfo.name);
                stationMarker.updateFromJson(stationStatus);
            } else {
                console.log("Creating ", stationInfo.name);
                // add new station to map
                stationMarker = StationInfoMarker.buildFromJSON(
                    stationStatus,
                    stationInfo
                );
                const marker = new Shumate.Marker();
                marker.set_child(stationMarker);
                marker.set_location(stationInfo.lat, stationInfo.lon);
                marker_layer?.add_marker(marker);

                self.station_markers.set(stationId, stationMarker);
            }
        });
    }

    async fetchNetworkUrls() {
        const gbfs_info = (await fetch(this.selected_network.url)) as Gbfs;
        let feeds = gbfs_info.data.feeds;
        if (!feeds) {
            // we might be in v2, where there's a language code key corresponding to the feeds array
            // use the first available language
            const language_code = Object.keys(gbfs_info.data)[0];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            feeds = gbfs_info.data[language_code]?.feeds ?? [];
        }
        feeds.forEach((feed) => {
            if (feed.name === "station_information") {
                this.#station_information_url = feed.url;
            } else if (feed.name === "station_status") {
                this.#station_status_url = feed.url;
            } else if (feed.name === "system_information") {
                this.#system_information_url = feed.url;
            }
        });
    }

    async fetchSystemInformation() {
        if (!this.#system_information_url) {
            console.error(
                `Network ${this.selected_network.name} is missing system information url!`
            );
            return;
        }
        const response = (await fetch(
            this.#system_information_url
        )) as SystemInformation;

        const flattenedObj = {};
        flattenObj(flattenedObj, null, response.data);
        Object.entries(flattenedObj).forEach(([attribute_name, value]) => {
            const row = new Adw.ActionRow({
                title: humanize_name(attribute_name),
                subtitle: JSON.stringify(value),
                cssClasses: ["property"],
            });
            this._stats_group.append(row);
        });
    }

    async fetchStationInformation() {
        if (!this.#station_information_url) {
            console.error(
                `Network ${this.selected_network.name} is missing station information url!`
            );
            return;
        }
        const response = (await fetch(
            this.#station_information_url
        )) as StationInformationResponse;
        response.data.stations.forEach((station) => {
            this.station_info_map.set(station.station_id, station);
        });
    }

    async fetchStationStatus() {
        if (!this.#station_status_url) {
            console.error(
                `Network ${this.selected_network.name} is missing station status url!`
            );
            return;
        }
        const response = (await fetch(
            this.#station_status_url
        )) as StationStatusResponse;
        response.data.stations.forEach((station) => {
            this.station_status_map.set(station.station_id, station);
        });
    }

    zoomToStations() {
        if (!this.station_info_map.size) return;

        let latAvg = 0,
            lonAvg = 0;
        this.station_info_map.forEach((station) => {
            latAvg += station.lat;
            lonAvg += station.lon;
        });
        latAvg /= this.station_info_map.size;
        lonAvg /= this.station_info_map.size;

        this._map_widget.get_map().center_on(latAvg, lonAvg);
    }
}
