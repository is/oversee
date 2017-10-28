package oversee

import "fmt"

// Startup is main start point
func Startup() {
	slot := Slot{
		name:     "default",
		capacity: 10,
	}
	fmt.Println("Oversee 0.0.2 ...")
	fmt.Printf("Slot %s capacity is %d\n", slot.name, slot.capacity)
}
