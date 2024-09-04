import Gtk from "gi://Gtk?version=4.0";
import GObject from "gi://GObject";

import { SUCCESS_ICON_NAME, CROSS_ICON_NAME, isAvailable } from "./utils.js";
import { Station } from "gbfs-typescript-types/v3.0/station_status.js";
import { Station as StationInformation } from "gbfs-typescript-types/v3.0/station_information.js";

export class StationInfoMarker extends Gtk.Box {
    station_name!: string;
    lat!: number;
    lon!: number;
    timestamp!: string;
    free_bikes!: string;
    free_bikes_icon_name!: string;
    empty_slots!: string;
    empty_slots_icon_name!: string;

    private _popover!: Gtk.Popover;
    private _marker_btn!: Gtk.Button;
    private _bikes_icon!: Gtk.Image;
    private _slots_icon!: Gtk.Image;

    static {
        GObject.registerClass(
            {
                GTypeName: "StationInfoMarker",
                Properties: {
                    name: GObject.ParamSpec.string(
                        "station-name",
                        "Station Name",
                        "The name of the station.",
                        GObject.ParamFlags.READWRITE,
                        "Unknown station name"
                    ),
                    lat: GObject.ParamSpec.double(
                        "lat",
                        "Latitude",
                        "The latitude of the station",
                        GObject.ParamFlags.READWRITE,
                        Number.MIN_SAFE_INTEGER,
                        Number.MAX_SAFE_INTEGER,
                        0.0
                    ),
                    lon: GObject.ParamSpec.double(
                        "lon",
                        "Longitude",
                        "The longitude of the station",
                        GObject.ParamFlags.READWRITE,
                        Number.MIN_SAFE_INTEGER,
                        Number.MAX_SAFE_INTEGER,
                        0.0
                    ),
                    timestamp: GObject.ParamSpec.string(
                        "timestamp",
                        "Timestamp",
                        "The raw timestamp of the last data retrieved from the station.",
                        GObject.ParamFlags.READWRITE,
                        ""
                    ),
                    "free-bikes": GObject.ParamSpec.string(
                        "free-bikes",
                        "Free Bikes",
                        "The number of bikes available in this station.",
                        GObject.ParamFlags.READWRITE,
                        ""
                    ),
                    "free-bikes-icon-name": GObject.ParamSpec.string(
                        "free-bikes-icon-name",
                        "Free Bikes Icon name",
                        "The icon name for free bikes.",
                        GObject.ParamFlags.READWRITE,
                        ""
                    ),
                    "empty-slots": GObject.ParamSpec.string(
                        "empty-slots",
                        "Empty slots",
                        "The number of slots available in this station.",
                        GObject.ParamFlags.READWRITE,
                        ""
                    ),
                    "empty-slots-icon-name": GObject.ParamSpec.string(
                        "empty-slots-icon-name",
                        "Empty slots Icon Name",
                        "The icon name for empty slots.",
                        GObject.ParamFlags.READWRITE,
                        ""
                    ),
                },
                Template:
                    "resource:///dev/garyli/SixWheels/station-info-marker.ui",
                InternalChildren: [
                    "popover",
                    "marker_btn",
                    "slots_icon",
                    "bikes_icon",
                ],
            },
            this
        );
    }
    constructor(constructProperties = {}) {
        super(constructProperties);

        this._marker_btn.connect("clicked", () => {
            this._popover.popup();
        });
    }

    static buildFromJSON(
        stationStatus: Station,
        stationInfo: StationInformation
    ) {
        const result = new StationInfoMarker();

        // changed in v3 to an array from string
        result.name = Array.isArray(stationInfo.name)
            ? stationInfo.name[0].text
            : (stationInfo.name as string);

        result.lat = stationInfo.lat;
        result.lon = stationInfo.lon;

        result.updateFromJson(stationStatus);

        return result;
    }

    updateFromJson(stationStatus: Station) {
        // changed in v3 to num_vehicles_available
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, prettier/prettier
        this.free_bikes = stationStatus.num_bikes_available?.toString() ?? stationStatus.num_vehicles_available?.toString() ?? "0";
        this.free_bikes_icon_name = isAvailable(this.free_bikes)
            ? SUCCESS_ICON_NAME
            : CROSS_ICON_NAME;
        this._bikes_icon.add_css_class(
            isAvailable(this.free_bikes)
                ? "available-icon"
                : "not-available-icon"
        );
        this.empty_slots = stationStatus.num_docks_available?.toString() ?? "0";
        this.empty_slots_icon_name = isAvailable(this.empty_slots)
            ? SUCCESS_ICON_NAME
            : CROSS_ICON_NAME;
        this._slots_icon.add_css_class(
            isAvailable(this.empty_slots)
                ? "available-icon"
                : "not-available-icon"
        );
        this.timestamp = new Date().toLocaleDateString();

        // update pin colour based on availability
        this.add_css_class(
            isAvailable(this.free_bikes) && isAvailable(this.empty_slots)
                ? "available-icon"
                : isAvailable(this.free_bikes) || isAvailable(this.empty_slots)
                ? "partially-available-icon"
                : "not-available-icon"
        );
    }
}
