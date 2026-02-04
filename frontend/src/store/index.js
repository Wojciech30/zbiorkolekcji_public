import { createStore } from "vuex";
import auth from "./modules/auth";
import collections from "./modules/collections";

export default createStore({
    modules: {
        auth,
        collections
    }
});