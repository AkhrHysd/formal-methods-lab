---------------------------- MODULE Counter ----------------------------
EXTENDS Naturals
CONSTANT Limit
VARIABLE count

Init == count = 0
Next == IF count < Limit THEN count' = count + 1 ELSE count' = 0
TypeOK == count \in 0..Limit
Spec == Init /\ [][Next]_count
=============================================================================
