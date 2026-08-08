import lowProfileWheel from "../assets/bikeTemplates/endurance/wheel-low-profile.svg";
import midProfileWheel from "../assets/bikeTemplates/endurance/wheel-mid-profile.svg";
import deepProfileFrontWheel from "../assets/bikeTemplates/endurance/wheel-deep-profile-front.svg";
import deepProfileRearWheel from "../assets/bikeTemplates/endurance/wheel-deep-profile-rear.svg";

export const wheelsetVisuals = Object.freeze({
  lowProfile: {
    front: lowProfileWheel,
    rear: lowProfileWheel,
  },
  midProfile: {
    front: midProfileWheel,
    rear: midProfileWheel,
  },
  deepProfile: {
    front: deepProfileFrontWheel,
    rear: deepProfileRearWheel,
  },
});
