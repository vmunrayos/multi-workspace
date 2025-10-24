import type { FunctionComponent, SVGProps } from "react";

declare module "*.svg" {
	const content: string;
	export const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
	export default content;
}
