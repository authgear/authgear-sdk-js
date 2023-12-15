import { useCallback, useState, type MouseEventHandler } from "react";
import { IonButton, IonAlert } from "@ionic/react";
import { Authgear } from "@authgear/capacitor";
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
      Authgear.echo({ value: "it works" }).then(
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
