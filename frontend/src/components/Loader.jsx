const Loader = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-card"></div>
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    </div>
  )
}

export default Loader