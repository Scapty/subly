'use client'

import { useState } from 'react'
import { CompatibilityResult } from '@/lib/supabase-client'
import {
  Star, TrendingUp, Heart, Users, Calendar,
  ChevronDown, ChevronUp, AlertTriangle,
  CheckCircle, Info
} from 'lucide-react'

interface CompatibilityScoreProps {
  compatibility: CompatibilityResult
  showDetails?: boolean
  size?: 'small' | 'medium' | 'large'
  className?: string
}

export default function CompatibilityScore({
  compatibility,
  showDetails = false,
  size = 'medium',
  className = ''
}: CompatibilityScoreProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4" />
    if (score >= 60) return <Star className="w-4 h-4" />
    return <AlertTriangle className="w-4 h-4" />
  }

  const sizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  }

  const badgeSize = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-1 text-sm',
    large: 'px-4 py-2 text-base'
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Score principal */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`rounded-full px-3 py-1 font-bold ${getScoreColor(compatibility.total_score)}`}>
              {compatibility.total_score}%
            </div>
            <div>
              <div className={`font-semibold ${sizeClasses[size]}`}>
                Compatibilité
              </div>
              <div className={`text-gray-600 ${sizeClasses[size]}`}>
                {compatibility.total_score >= 80 ? 'Excellente' :
                 compatibility.total_score >= 60 ? 'Bonne' : 'Modérée'}
              </div>
            </div>
          </div>

          {showDetails && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
        </div>

        {/* Barre de progression */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                compatibility.total_score >= 80 ? 'bg-green-500' :
                compatibility.total_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${compatibility.total_score}%` }}
            />
          </div>
        </div>

        {/* Points forts (aperçu) */}
        {compatibility.strengths.length > 0 && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1">
              {compatibility.strengths.slice(0, 2).map((strength, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center ${badgeSize[size]} bg-green-100 text-green-700 rounded-full font-medium`}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {strength}
                </span>
              ))}
              {compatibility.strengths.length > 2 && (
                <span className={`${badgeSize[size]} bg-gray-100 text-gray-600 rounded-full font-medium`}>
                  +{compatibility.strengths.length - 2} autres
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Détails étendus */}
      {showDetails && isExpanded && (
        <div className="border-t bg-gray-50 p-4 space-y-4">
          {/* Détail des scores */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Détail des scores
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-2" />
                  Compatibilité d'âge
                </span>
                <span className="font-medium">
                  {compatibility.breakdown.age_compatibility}/25
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm text-gray-600">
                  <Heart className="w-4 h-4 mr-2" />
                  Style de vie
                </span>
                <span className="font-medium">
                  {compatibility.breakdown.lifestyle_compatibility}/35
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm text-gray-600">
                  <Star className="w-4 h-4 mr-2" />
                  Intérêts communs
                </span>
                <span className="font-medium">
                  {compatibility.breakdown.hobbies_compatibility}/20
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  Préférences
                </span>
                <span className="font-medium">
                  {compatibility.breakdown.preferences_match}/20
                </span>
              </div>
            </div>
          </div>

          {/* Tous les points forts */}
          {compatibility.strengths.length > 0 && (
            <div>
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Points forts
              </h4>
              <div className="space-y-1">
                {compatibility.strengths.map((strength, index) => (
                  <div key={index} className="flex items-center text-sm text-green-700">
                    <CheckCircle className="w-3 h-3 mr-2 flex-shrink-0" />
                    {strength}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Points d'attention */}
          {compatibility.potential_issues.length > 0 && (
            <div>
              <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                Points d'attention
              </h4>
              <div className="space-y-1">
                {compatibility.potential_issues.map((issue, index) => (
                  <div key={index} className="flex items-center text-sm text-orange-700">
                    <AlertTriangle className="w-3 h-3 mr-2 flex-shrink-0" />
                    {issue}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conseil */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>Conseil :</strong> Ce score est calculé en fonction de votre profil et des informations de l'annonce.
                N'hésitez pas à contacter le propriétaire pour en savoir plus sur l'ambiance de la colocation.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Composant simplifié pour les badges de score
export function CompatibilityBadge({
  score,
  size = 'medium',
  className = ''
}: {
  score: number
  size?: 'small' | 'medium' | 'large'
  className?: string
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500 text-white'
    if (score >= 60) return 'bg-yellow-500 text-white'
    return 'bg-orange-500 text-white'
  }

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-2 py-1 text-sm',
    large: 'px-3 py-1 text-base'
  }

  return (
    <div className={`inline-flex items-center rounded-full font-medium ${getScoreColor(score)} ${sizeClasses[size]} ${className}`}>
      <Star className="w-3 h-3 mr-1" />
      {score}%
    </div>
  )
}