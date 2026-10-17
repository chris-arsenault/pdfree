import { errors } from "./ja/errors";
import { ui } from "./ja/ui";
import { more } from "./ja/more";
import { dynamic } from "./ja/dynamic";
import { base } from "./ja/base";
import { type Catalog } from "../runtime";
export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
