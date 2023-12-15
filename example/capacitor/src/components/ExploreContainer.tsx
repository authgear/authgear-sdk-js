import { useCallback, useState, type MouseEventHandler } from "react";
import { IonButton, IonAlert } from "@ionic/react";
import {
  Authgear,
  base64URLDecode,
  base64URLEncode,
} from "@authgear/capacitor";
import "./ExploreContainer.css";

interface ContainerProps {}

const ExploreContainer: React.FC<ContainerProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const onDidDismiss = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onClickButton: MouseEventHandler<HTMLIonButtonElement> = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      const arrayBuffer1 = new TextEncoder().encode(
        "can import from @authgear/core"
      );
      const base64url = base64URLEncode(arrayBuffer1);
      const arrayBuffer2 = base64URLDecode(base64url);
      const str = new TextDecoder().decode(arrayBuffer2);

      Authgear.echo({ value: str }).then(
        (result) => {
          setMessage(result.value);
          setIsOpen(true);
        },
        (e) => {
          console.error(e);
        }
      );
    },
    []
  );

  return (
    <div id="container">
      <IonButton onClick={onClickButton}>Test</IonButton>
      <IonAlert isOpen={isOpen} onDidDismiss={onDidDismiss} message={message} />
    </div>
  );
};

export default ExploreContainer;
