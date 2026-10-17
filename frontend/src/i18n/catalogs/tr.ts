import { errors } from "./tr/errors";
import { ui } from "./tr/ui";
import { more } from "./tr/more";
import { dynamic } from "./tr/dynamic";
import { base } from "./tr/base";
import { type Catalog } from "../runtime";
export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
