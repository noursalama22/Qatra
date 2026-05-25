import { Dispatch, SetStateAction } from "react";
import NgoDistributionMap from "../components/ngo/NgoDistributionMap";
import type { Wallet } from "../lib/zoneMapUtils";

type Props = {
  onToast: (msg: string) => void;
  wallet: Wallet;
  setWallet: Dispatch<SetStateAction<Wallet>>;
  ngoId: string;
};

export default function Dashboard({ onToast, wallet, setWallet, ngoId }: Props) {
  return (
    <NgoDistributionMap
      onToast={onToast}
      wallet={wallet}
      setWallet={setWallet}
      layout="dashboard"
      ngoId={ngoId}
    />
  );
}
