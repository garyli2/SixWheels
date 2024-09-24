import Gio from "gi://Gio";
import Soup from "gi://Soup?version=3.0";
import GLib from "gi://GLib";

Gio._promisify(
    Soup.Session.prototype,
    "send_and_read_async",
    "send_and_read_finish"
);

export const SUCCESS_ICON_NAME = "check-round-outline2-symbolic";
export const CROSS_ICON_NAME = "cross-large-circle-outline-symbolic";

// API Responses
const http_session = new Soup.Session();

export const fetch = async (url: string) => {
    const message = Soup.Message.new("GET", url);
    console.log(`Fetching ${url}`);

    // eslint-disable-next-line @typescript-eslint/await-thenable
    const bytes = await http_session.send_and_read_async(
        message,
        GLib.PRIORITY_DEFAULT,
        null
    );
    if (message.get_status() !== Soup.Status.OK) {
        console.error(`HTTP Status ${message.get_status()}`);
        return;
    }

    const text_decoder = new TextDecoder("utf-8");
    // @ts-expect-error gi-types promisify
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
    const decoded_text = text_decoder.decode(bytes.toArray());
    return JSON.parse(decoded_text) as unknown;
};

export const convertTimestampToLocalTime = (timestamp: string) => {
    const date = new Date(timestamp);

    return date.toLocaleDateString(undefined, {
        hour: "numeric",
        minute: "numeric",
    });
};

export const isAvailable = (str: string) => {
    return Number.parseInt(str) > 0;
};

export const humanize_name = (str: string) => {
    return str.replaceAll("_", " ").trim();
};

const isLiteralObject = (a: unknown) => {
    return !!a && a.constructor === Object;
};

export const flattenObj = (
    flattenedObj: object,
    parentAttribute: string | null,
    curObj: object
): void => {
    if (!curObj) return;

    Object.entries(curObj).forEach(([key, val]) => {
        if (isLiteralObject(val)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            flattenObj(flattenedObj, key, val);
        } else {
            const newKey = parentAttribute
                ? `${parentAttribute} -> ${key}`
                : key;
            // @ts-expect-error unknown
            flattenedObj[newKey] =
                typeof val !== "string" ? JSON.stringify(val) : val;
        }
    });
};
