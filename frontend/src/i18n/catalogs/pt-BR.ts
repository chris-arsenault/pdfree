import { errors } from "./pt-BR/errors";
import { ui } from "./pt-BR/ui";
import { more } from "./pt-BR/more";
import { dynamic } from "./pt-BR/dynamic";
import { base } from "./pt-BR/base";
import { type Catalog } from "../runtime";

export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
