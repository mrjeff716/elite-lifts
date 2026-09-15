import { CalendarCheck, CircleFadingPlus, Dumbbell, House, Settings } from 'lucide-react'
import React from 'react'
import { Link } from 'react-router'

const Navbar = () => {
  return (
    <div className="bg-card/50 backdrop-blur-xl  w-[90%] justify-self-center h-16 p-3 fixed bottom-7 rounded-full flex items-center justify-center gap-5 text-white z-10">
      <Link className="flex flex-col items-center text-xs sm:text-md md:text-lg rounded-md active:bg-primaryHover transition" to="/"><House className="size-4 sm:size-5"/>Home</Link>
      <Link className="flex flex-col items-center text-xs sm:text-md md:text-lg rounded-md active:bg-primaryHover transition" to="/feed"><CircleFadingPlus className="size-4 sm:size-5"/>Feed</Link>
      <Link className="flex flex-col items-center text-xs sm:text-md md:text-lg rounded-md active:bg-primaryHover transition" to="/exercises"><Dumbbell className="size-4 sm:size-5"/>Exercises</Link>
      <Link className="flex flex-col items-center text-xs sm:text-md md:text-lg rounded-md active:bg-primaryHover transition" to="/workout"><CalendarCheck className="size-4 sm:size-5"/>Workouts</Link>
      <Link className="flex flex-col items-center text-xs sm:text-md md:text-lg rounded-md active:bg-primaryHover transition" to="/settings"><Settings className="size-4 sm:size-5"/>Settings</Link>
    </div>
  )
}

export default Navbar
