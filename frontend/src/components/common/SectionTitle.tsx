interface SectionTitleProps {
  title: string
  className?: string
}

export function SectionTitle({ title, className = "" }: SectionTitleProps) {
  return (
    <div className={`text-center mb-10 md:mb-16 ${className}`}>
      <div className="flex items-center justify-center space-x-6 mb-6">
        <div
          className="h-[3px] w-16 md:w-32 mt-1"
          style={{
            background:
              "linear-gradient(90deg, rgba(151, 103, 255, 0) 32.7%, #FFFFFF 95%, #3F1A8F 100%)",
          }}
        />
        <h2 className="text-2xl md:text-4xl font-bold text-white">{title}</h2>
        <div
          className="h-[3px] w-16 md:w-32 -rotate-180 mt-1"
          style={{
            background:
              "linear-gradient(90deg, rgba(151, 103, 255, 0) 32.7%, #FFFFFF 95%, #3F1A8F 100%)",
          }}
        />
      </div>
    </div>
  )
}
