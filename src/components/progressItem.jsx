import Link from 'next/link'
import { FiCheckCircle } from 'react-icons/fi'

const ProgressItem = props => {
  return (
    <Link href={props.href}>
      <span style={{ opacity: '/' + props.tab === props.href ? 1 : 0.3 }}>
        <FiCheckCircle className='icon' style={{ color: `#FFFFFF${props.completed ? 'FF' : '00'}` }} />
        {props.number}. {props.title}
      </span>
    </Link>
  )
}

export default ProgressItem
