export type AddressValue = {
  address_line1: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
};

export const emptyAddress: AddressValue = { address_line1: '', landmark: '', city: '', state: '', pincode: '', latitude: null, longitude: null };
