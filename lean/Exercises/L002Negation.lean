namespace Exercises.L002Negation

theorem threeNotFour : ¬ (3 = 4) := by
  decide

theorem sevenNotZero : ¬ (7 = 0) := by
  decide



theorem eightNotNine : ¬ (8 = 9) := by
  decide

#check eightNotNine

end Exercises.L002Negation
#eval (!(1 == 2))
#eval (decide (¬ (1 = 2)))
