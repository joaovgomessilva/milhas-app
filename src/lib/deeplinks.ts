/**
 * Links para a busca já preenchida no site da companhia.
 * O app não emite nada: ele leva a pessoa até o lugar certo para conferir e comprar.
 * Os formatos de URL são os públicos conhecidos em 2026 e podem mudar; se o link
 * quebrar, a página inicial da companhia ainda abre.
 */
import type { AirlineId, CabinId } from "@/data/programs";

type Args = { airline: AirlineId; from: string; to: string; date: string; passengers: number; cabin: CabinId; miles: boolean };

export function airlineSearchUrl({ airline, from, to, date, passengers, cabin, miles }: Args): string {
  const [y, m, d] = date.split("-");
  switch (airline) {
    case "latam": {
      const p = new URLSearchParams({
        origin: from,
        destination: to,
        outbound: `${date}T12:00:00.000Z`,
        adt: String(passengers),
        chd: "0",
        inf: "0",
        trip: "OW",
        cabin: cabin === "business" ? "Business" : cabin === "premium" ? "Premium_Economy" : "Economy",
        redemption: miles ? "true" : "false",
        sort: "RECOMMENDED",
      });
      return `https://www.latamairlines.com/br/pt/oferta-voos?${p.toString()}`;
    }
    case "gol": {
      if (miles) {
        const p = new URLSearchParams({
          tripType: "ow",
          originAirport: from,
          destinationAirport: to,
          departureDate: date,
          adults: String(passengers),
          children: "0",
          infants: "0",
          cabinType: cabin === "business" ? "business" : "economy",
        });
        return `https://www.smiles.com.br/mfe/emissao-passagem/?${p.toString()}`;
      }
      const p = new URLSearchParams({
        tripType: "ow",
        originAirport: from,
        destinationAirport: to,
        departureDate: `${d}/${m}/${y}`,
        adults: String(passengers),
      });
      return `https://b2c.voegol.com.br/compra/busca-parceiros?${p.toString()}`;
    }
    case "azul": {
      const p = new URLSearchParams({
        c1: from,
        c2: to,
        dd1: `${d}/${m}/${y}`,
        ADT: String(passengers),
        currency: miles ? "PTS" : "BRL",
      });
      return `https://www.voeazul.com.br/br/pt/home/selecao-voo?${p.toString()}`;
    }
  }
}
