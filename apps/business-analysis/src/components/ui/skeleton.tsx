
function Skeleton({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={"bg-accent animate-pulse rounded-md"}
      {...props}
    />
  )
}

export { Skeleton }
