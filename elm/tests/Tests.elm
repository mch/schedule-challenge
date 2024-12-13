module Tests exposing (..)

import Expect
import Test exposing (Test, describe, test)

filterEvents events query = 
     ["Eat breakfast"]

suite : Test
suite =
    describe "Schedule Logic"
        -- Arrange: I would like an input list of s = "eat"
        -- The model should be a list of events:
        -- 1. Eat breakfast
        -- 2. Workout
        -- Act: Apply filter
        -- Assert: Resulting list contains only eat breakfast
        [ test "we can filter the schedule to match input" 
            <| \_ -> Expect.equal 
                (filterEvents ["Eat breakfast", "Workout"] "eat") 
                ["Eat breakfast"]
        ]

