export const metadata = {
  title: 'Workspace - Finaxial',
  description: 'Financial Analysis Workspace',
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {children}
    </div>
  )
}
