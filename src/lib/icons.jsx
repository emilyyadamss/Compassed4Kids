/* Two small icon sets: one for a kid's avatar, one for the kind of thing they
   do. Both are stored as short string ids on the record, so the picker can
   change without touching saved data. */
import {
  NotebookPen, Calculator, BookOpen, Piano, Guitar, Dumbbell, Bike, Palette,
  FlaskConical, Languages, Puzzle, Sparkles, Bed, Utensils, Trash2, Shirt,
  PawPrint, Globe, Trophy, Music, Blocks, GraduationCap,
  Cat, Dog, Rabbit, Bird, Fish, Turtle, Squirrel, Snail, Rocket, Star,
} from 'lucide-react'

/* ------------------------------------------------------------- activities */

export const ACTIVITY_ICONS = {
  homework: NotebookPen,
  kumon: Calculator,
  reading: BookOpen,
  piano: Piano,
  guitar: Guitar,
  music: Music,
  sports: Dumbbell,
  bike: Bike,
  art: Palette,
  science: FlaskConical,
  spelling: Languages,
  puzzle: Puzzle,
  blocks: Blocks,
  tidy: Sparkles,
  bed: Bed,
  dishes: Utensils,
  trash: Trash2,
  laundry: Shirt,
  pet: PawPrint,
  world: Globe,
  trophy: Trophy,
  school: GraduationCap,
}

export const ACTIVITY_ICON_CHOICES = Object.keys(ACTIVITY_ICONS)

export const normaliseActivityIcon = (id) =>
  ACTIVITY_ICONS[id] ? id : ACTIVITY_ICON_CHOICES[0]

export function ActivityIcon({ id, size = 20, ...rest }) {
  const Cmp = ACTIVITY_ICONS[normaliseActivityIcon(id)]
  return <Cmp size={size} strokeWidth={2} aria-hidden="true" {...rest} />
}

/* ----------------------------------------------------------------- avatars */

export const AVATARS = {
  rabbit: Rabbit,
  cat: Cat,
  dog: Dog,
  bird: Bird,
  fish: Fish,
  turtle: Turtle,
  squirrel: Squirrel,
  snail: Snail,
  rocket: Rocket,
  star: Star,
}

export const AVATAR_CHOICES = Object.keys(AVATARS)

export const normaliseAvatar = (id) => (AVATARS[id] ? id : AVATAR_CHOICES[0])

export function Avatar({ id, size = 22, ...rest }) {
  const Cmp = AVATARS[normaliseAvatar(id)]
  return <Cmp size={size} strokeWidth={2} aria-hidden="true" {...rest} />
}
