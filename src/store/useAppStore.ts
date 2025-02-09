// import { create } from "zustand";
// import { persist } from "zustand/middleware";

// type AppStoreType = {
//   bokBokId?: string;
//   setBokBokId: (bokBokId: string) => void;
//   clear: () => void;
// };

// // Create the store
// export const useAppStore = create<AppStoreType>()(
//   persist(
//     (set) => ({
//       bokBokId: undefined,
//       setBokBokId: (id) => set(() => ({ bokBokId: id })),
//       clear: () => set(() => ({ bokBokId: undefined })),
//     }),
//     {
//       name: "bokbok-app-storage",
//     }
//   )
// );
