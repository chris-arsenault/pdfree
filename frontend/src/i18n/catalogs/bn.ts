import { errors } from "./bn/errors";
import { ui } from "./bn/ui";
import { more } from "./bn/more";
import { dynamic } from "./bn/dynamic";
import { base } from "./bn/base";
import { type Catalog } from "../runtime";
export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
