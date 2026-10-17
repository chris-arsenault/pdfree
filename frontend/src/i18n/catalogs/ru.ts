import { errors } from "./ru/errors";
import { ui } from "./ru/ui";
import { more } from "./ru/more";
import { dynamic } from "./ru/dynamic";
import { base } from "./ru/base";
import { type Catalog } from "../runtime";
export default { ...errors, ...ui, ...more, ...dynamic, ...base } as const satisfies Catalog;
