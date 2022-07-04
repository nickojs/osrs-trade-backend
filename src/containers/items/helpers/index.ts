import { APIItem, ItemQuery } from '../items.interface';

export const generateUrl = (params: ItemQuery): string =>
  `https://services.runescape.com/m=itemdb_rs/api/catalogue/items.json?category=${params.category}&alpha=${params.name}&page=0`;

export const itemFactory = (rawItem: APIItem): APIItem => {
  const { id, icon, description, name } = rawItem;

  return {
    id,
    icon,
    description,
    name,
  };
};

export const generateUrlForSingleItem = (id: string): string =>
  `https://secure.runescape.com/m=itemdb_rs/api/catalogue/detail.json?item=${id}`;
