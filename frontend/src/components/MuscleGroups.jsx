import { imageUrls } from "../utils/utils.js";

  export default function MuscleImages(props) {
    return imageUrls.map((img) => {
      return (
        <div ref={props.ref} className="rouded-full py-4 px-10 mx-5 bg-card flex flex-col items-center rounded-xl text-center">
          <button onClick={() => {
            props.setPrimaryMuscles(img.name.toLowerCase())
            props.setIsLoading(true)
            }}>
            <img loading="lazy" src={img.imageUrl} className="w-24 h-32 object-contains" />
            <h1 className="text-xl font-bold text-primary">{img.name}</h1>
          </button>
        </div>
      );
    });
  }