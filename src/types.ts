export type PortSide = 'front' | 'rear' | 'both';
export type Face = 'front' | 'rear';

export type PortType = 'rj45' | 'sfp' | 'usb-a' | 'usb-c' | 'power' | 'coax' | 'other';

export interface PortDef {
  id: string;
  label: string;
  type: PortType;
  side: PortSide;
  occupied?: boolean;
}

export type Category =
  | 'Networking'
  | 'Compute & Storage'
  | 'Power & Cooling'
  | 'Patch & Cable'
  | 'Structural'
  | 'Custom';

export interface DeviceTemplate {
  id: string;
  name: string;
  category: Category;
  heightU: number;
  color: string;
  ports: PortDef[];
  builtIn?: boolean;
  /** Which elevation(s) this device appears in. Defaults to "both" when
   * unset; only set this to "front"/"rear" for gear that's genuinely only
   * ever visible from one side (a blanking plate installed from the front,
   * a cable arm on the rear). Independent of individual port sides. */
  mountSide?: PortSide;
}

export interface MountedDevice {
  instanceId: string;
  templateId: string;
  name: string;
  startU: number;
  heightU: number;
  color: string;
  ports: PortDef[];
  mountSide?: PortSide;
}

export interface Connection {
  id: string;
  fromDevice: string;
  fromPort: string;
  toDevice: string | null;
  toPort: string | null;
  toExternalLabel?: string;
  /** Which elevation this cable was made from. Ports set to side "both" can
   * carry an independent connection on each face; this disambiguates which
   * one a given connection belongs to. Absent on data saved before this
   * field existed. */
  face?: Face;
  color: string;
}

export interface RackConfig {
  id: string;
  name: string;
  heightU: number;
  widthIn: number;
  devices: MountedDevice[];
  connections: Connection[];
}
