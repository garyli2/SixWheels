import GObject from "gi://GObject";

class NetworkInformation extends GObject.Object {
    name!: string;
    url!: string;
    country!: string;
    location!: string;

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
                },
            },
            this
        );
    }
}

export default NetworkInformation;
