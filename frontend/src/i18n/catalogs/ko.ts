import { errors } from "./ko/errors";
import { ui } from "./ko/ui";
import { more } from "./ko/more";
import { dynamic } from "./ko/dynamic";
import { base } from "./ko/base";
import { type Catalog } from "../runtime";
export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
