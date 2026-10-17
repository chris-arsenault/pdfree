import { errors } from "./it/errors";
import { ui } from "./it/ui";
import { more } from "./it/more";
import { dynamic } from "./it/dynamic";
import { base } from "./it/base";
import { type Catalog } from "../runtime";

export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
