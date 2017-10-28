package oversee

// TaskState State of Task
type TaskState int

//
const (
	_ TaskState = iota
	StateInit
	StateWait
	StateReady
	StateSkip
	StateRun
	StateFail
	StateDone
	StateInvalid
	StateCancel
)

// TaskNode node in task dependency graph
type TaskNode struct {
	fore []*TaskNode
	rear []*TaskNode
}
