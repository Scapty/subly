import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-display font-bold text-dark-gray mb-4">
            Sub<span className="text-primary">let</span>
          </h1>
          <p className="text-lg text-gray-600">
            Trouve ton logement étudiant en swipant !
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/register"
            className="block btn-primary text-center"
          >
            Créer un compte
          </Link>

          <Link
            href="/login"
            className="block bg-white text-primary border-2 border-primary font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:bg-primary hover:text-white"
          >
            Se connecter
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>🏠 Trouve • 💕 Match • 🤝 Connecte</p>
        </div>
      </div>
    </div>
  )
}