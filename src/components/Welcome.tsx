import { useRef } from "react";
import toast from "react-hot-toast";

export default function Welcome() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleGetStarted = () => {
    const id = inputRef.current?.value;

    if (!id) {
      toast.error("Please enter a meeting ID");
      return;
    }
    if (id.length < 4 && id.includes(" ")) {
      toast.error("Meeting ID must be at least 4 characters and no spaces");
      return;
    }
    window.location.href = "/" + id;
    // window.location.reload();
  };

  const handleGetStartedOneToOne = () => {
    window.location.href = "/one-to-one";
  };

  return (
    <div className="max-w-screen-xl mt-24 px-8 xl:px-16 mx-auto" id="welcome">
      <div>
        <div className="grid grid-flow-row sm:grid-flow-col grid-rows-2 md:grid-rows-1 sm:grid-cols-2 gap-8 py-6 sm:py-16">
          <div className=" flex flex-col justify-center items-start row-start-2 sm:row-start-1">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-medium text-black dark:text-gray-100">
              Welcome, BokBok now...
            </h1>
            <p className="text-gray-500 mt-4 mb-6">
              Now it is easy and secure to chat with your friends. BokBok is a
              free video chat app that allows you to chat with your friends.
            </p>
            <div className="relative w-full bg-gray-900 rounded-full flex">
              <input
                ref={inputRef}
                type="text"
                name=""
                className="w-full bg-zinc-200 dark:bg-gray-900 rounded-full py-3 lg:py-4 px-4 lg:px-6 text-zinc-900 dark:text-white placeholder:text-gray-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-900 focus:ring-green-500 focus:outline-none"
                placeholder="Enter meeting ID"
              />
              <button
                onClick={handleGetStarted}
                className="absolute right-0 py-3 lg:py-4 px-6 lg:px-16 text-white-500 font-semibold rounded-full bg-green-500  active:bg-green-600 hover:shadow-green-md transition-all outline-none cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-900 focus:ring-green-500 focus:outline-none"
              >
                Get Started
              </button>
            </div>
            <button
              onClick={handleGetStartedOneToOne}
              className="w-full mt-4 py-3 lg:py-4 px-6 lg:px-16 text-white-500 font-semibold rounded-full bg-green-500  active:bg-green-600 hover:shadow-green-md transition-all outline-none cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-900 focus:ring-green-500 focus:outline-none"
            >
              One-To-One
            </button>
          </div>
          <div className="w-full flex justify-center items-center p-5">
            <img
              alt="image.png"
              src="image.png"
              loading="lazy"
              className="max-h-100 w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
