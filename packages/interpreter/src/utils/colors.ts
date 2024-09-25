export const DEFAULT_SATURATION = 0.05;
export const DEFAULT_VALUE = 1.0;
export const DEFAULT_SATURATION_HEADER = 0.14;

function HSVtoRGB(
    h: number, 
    s: number, 
    v: number
): [number, number, number] {
    let r: number, g: number, b: number, i: number, 
        f: number, p: number, q: number, t: number;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    r = 0;
    g = 0;
    b = 0;
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    r = Math.round(r * 255)
    g = Math.round(g * 255)
    b = Math.round(b * 255)
    return [r, g, b];
}

function RGBtoString(r: number, g: number, b: number): string {
    return "#" + r.toString(16) + g.toString(16) + b.toString(16);
}

export function colorFromText(
    text: string, 
    saturation: number = DEFAULT_SATURATION, 
    value: number = DEFAULT_VALUE
): string { 
    const str = (text + "abcde").toLowerCase() // otherwise short strings are boring colors
    let hash = 0; 

    for (let i = 0; i < str.length; i++) { 
        hash = ((hash << 5) - hash) + str.charCodeAt(i); 
        hash = hash & hash; 
    } 
    
    const hue = (hash & 0xFF) / 255;
    return RGBtoString(...HSVtoRGB(hue, saturation, value));
}