export type Airport = {
  code: string;
  city: string;
  name: string;
  country: "BR" | "INTL";
  lat: number;
  lon: number;
};

export const AIRPORTS: Airport[] = [
  { code: "GRU", city: "São Paulo", name: "Guarulhos", country: "BR", lat: -23.43, lon: -46.47 },
  { code: "CGH", city: "São Paulo", name: "Congonhas", country: "BR", lat: -23.63, lon: -46.66 },
  { code: "VCP", city: "Campinas", name: "Viracopos", country: "BR", lat: -23.01, lon: -47.13 },
  { code: "GIG", city: "Rio de Janeiro", name: "Galeão", country: "BR", lat: -22.81, lon: -43.25 },
  { code: "SDU", city: "Rio de Janeiro", name: "Santos Dumont", country: "BR", lat: -22.91, lon: -43.16 },
  { code: "BSB", city: "Brasília", name: "Pres. Juscelino Kubitschek", country: "BR", lat: -15.87, lon: -47.92 },
  { code: "CNF", city: "Belo Horizonte", name: "Confins", country: "BR", lat: -19.62, lon: -43.97 },
  { code: "SSA", city: "Salvador", name: "Dep. Luís Eduardo Magalhães", country: "BR", lat: -12.91, lon: -38.33 },
  { code: "REC", city: "Recife", name: "Guararapes", country: "BR", lat: -8.13, lon: -34.92 },
  { code: "FOR", city: "Fortaleza", name: "Pinto Martins", country: "BR", lat: -3.78, lon: -38.53 },
  { code: "NAT", city: "Natal", name: "Gov. Aluízio Alves", country: "BR", lat: -5.77, lon: -35.37 },
  { code: "MCZ", city: "Maceió", name: "Zumbi dos Palmares", country: "BR", lat: -9.51, lon: -35.79 },
  { code: "POA", city: "Porto Alegre", name: "Salgado Filho", country: "BR", lat: -29.99, lon: -51.17 },
  { code: "CWB", city: "Curitiba", name: "Afonso Pena", country: "BR", lat: -25.53, lon: -49.18 },
  { code: "FLN", city: "Florianópolis", name: "Hercílio Luz", country: "BR", lat: -27.67, lon: -48.55 },
  { code: "MAO", city: "Manaus", name: "Eduardo Gomes", country: "BR", lat: -3.04, lon: -60.05 },
  { code: "LIS", city: "Lisboa", name: "Humberto Delgado", country: "INTL", lat: 38.77, lon: -9.13 },
  { code: "MAD", city: "Madri", name: "Barajas", country: "INTL", lat: 40.47, lon: -3.56 },
  { code: "MIA", city: "Miami", name: "Miami International", country: "INTL", lat: 25.79, lon: -80.29 },
  { code: "MCO", city: "Orlando", name: "Orlando International", country: "INTL", lat: 28.43, lon: -81.31 },
  { code: "JFK", city: "Nova York", name: "John F. Kennedy", country: "INTL", lat: 40.64, lon: -73.78 },
  { code: "EZE", city: "Buenos Aires", name: "Ezeiza", country: "INTL", lat: -34.82, lon: -58.54 },
  { code: "SCL", city: "Santiago", name: "Arturo Merino Benítez", country: "INTL", lat: -33.39, lon: -70.79 },
  { code: "MVD", city: "Montevidéu", name: "Carrasco", country: "INTL", lat: -34.84, lon: -56.03 },
];

export const airportByCode = (code: string) => AIRPORTS.find((a) => a.code === code);

export function distanceKm(a: Airport, b: Airport) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
