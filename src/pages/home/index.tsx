import Flex from '@/components/Flex'

export default function Home() {
  return (
    <>
      <Flex
        center
        className='text-white'
      >
        <div className='w-50 bg-red-500'>1</div>
        <span className='bg-amber-500'>2</span>
        <span className='bg-blue-700'>3</span>
      </Flex>
    </>
  )
}
