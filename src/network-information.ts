import GObject from "gi://GObject";

class NetworkInformation extends GObject.Object {
    name!: string;
    url!: string;
    country!: string;
    location!: string;
    lat!: number;
    lon!: number;

    static {
        GObject.registerClass(
            {
                GTypeName: "NetworkInformation",
                Properties: {
                    name: GObject.ParamSpec.string(
                        "name",
                        "Name",
                        "The name of the network",
                        GObject.ParamFlags.READWRITE,
                        "Unknown network name"
                    ),
                    // company: GObject.ParamSpec.jsobject(
                    //     "company",
                    //     "Company",
                    //     "An array of companies responsible for this network",
                    //     GObject.ParamFlags.READWRITE
                    // ),
                    url: GObject.ParamSpec.string(
                        "url",
                        "URL",
                        "The user facing URL of the network",
                        GObject.ParamFlags.READWRITE,
                        ""
                    ),
                    country: GObject.ParamSpec.string(
                        "country",
                        "Country",
                        "The country code of the network",
                        GObject.ParamFlags.READWRITE,
                        "Unknown country"
                    ),
                    location: GObject.ParamSpec.string(
                        "location",
                        "Location",
                        "The location of the network.",
                        GObject.ParamFlags.READWRITE,
                        "Unknown location"
                    ),
                    lat: GObject.ParamSpec.double(
                        "lat",
                        "Latitude",
                        "The latitude of the network",
                        GObject.ParamFlags.READWRITE,
                        Number.MIN_SAFE_INTEGER,
                        Number.MAX_SAFE_INTEGER,
                        0.0
                    ),
                    lon: GObject.ParamSpec.double(
                        "lon",
                        "Longitude",
                        "The longitude of the network",
                        GObject.ParamFlags.READWRITE,
                        Number.MIN_SAFE_INTEGER,
                        Number.MAX_SAFE_INTEGER,
                        0.0
                    ),
                },
            },
            this
        );
    }
}

export default NetworkInformation;
