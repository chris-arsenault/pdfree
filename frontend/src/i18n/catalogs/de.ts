import { errors } from "./de/errors";
import { ui } from "./de/ui";
import { more } from "./de/more";
import { dynamic } from "./de/dynamic";
import { base } from "./de/base";
import { type Catalog } from "../runtime";

export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
