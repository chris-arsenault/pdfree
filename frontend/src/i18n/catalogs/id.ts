import { errors } from "./id/errors";
import { ui } from "./id/ui";
import { more } from "./id/more";
import { dynamic } from "./id/dynamic";
import { base } from "./id/base";
import { type Catalog } from "../runtime";
export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
